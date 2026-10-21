import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { Message } from "../models/message.model.js";
import { Match } from "../models/match.model.js";
import { User } from "../models/user.model.js";
import { Block } from "../models/block.model.js";
import { verifyChatAccess } from "../utils/chatAuth.js";
import {
  sendMessage,
  getConversationHistory,
  markConversationRead,
  getUnreadCounts,
  getConversationsList,
} from "../services/message.service.js";
import {
  getConversations,
  getMessages,
  postMessage,
  postMarkRead,
  getUnread,
} from "../controllers/chat.controller.js";

describe("Batch 6: Chat Authorization, Service & Persistence", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Message Model Schema & Validation", () => {
    it("validates valid message properties and serializes via toMessageDTO", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const senderId = new mongoose.Types.ObjectId();
      const recipientId = new mongoose.Types.ObjectId();

      const msg = new Message({
        match: matchId,
        sender: senderId,
        recipient: recipientId,
        text: "  Hello world!  ",
        clientMessageId: "client-unique-123",
      });

      const err = await msg.validate().catch((e) => e);
      expect(err).toBeUndefined();
      expect(msg.text).toBe("Hello world!");

      const dto = msg.toMessageDTO();
      expect(dto.id).toBeDefined();
      expect(dto.matchId).toBe(matchId.toString());
      expect(dto.senderId).toBe(senderId.toString());
      expect(dto.recipientId).toBe(recipientId.toString());
      expect(dto.text).toBe("Hello world!");
      expect(dto.clientMessageId).toBe("client-unique-123");
      expect(dto.isRead).toBe(false);
      expect(dto.readAt).toBeNull();
    });

    it("rejects empty, whitespace-only, or oversized messages", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const senderId = new mongoose.Types.ObjectId();
      const recipientId = new mongoose.Types.ObjectId();

      // Empty text
      const emptyMsg = new Message({
        match: matchId,
        sender: senderId,
        recipient: recipientId,
        text: "   ",
      });
      const emptyErr = await emptyMsg.validate().catch((e) => e);
      expect(emptyErr).toBeDefined();
      expect(emptyErr.errors["text"]).toBeDefined();

      // Oversized text (>2000 chars)
      const longMsg = new Message({
        match: matchId,
        sender: senderId,
        recipient: recipientId,
        text: "a".repeat(2001),
      });
      const longErr = await longMsg.validate().catch((e) => e);
      expect(longErr).toBeDefined();
      expect(longErr.errors["text"]).toBeDefined();
    });
  });

  describe("Chat Access Authorization (verifyChatAccess)", () => {
    it("rejects invalid match IDs or user IDs", async () => {
      const validId = new mongoose.Types.ObjectId();

      const res1 = await verifyChatAccess("not-an-id", validId);
      expect(res1.authorized).toBe(false);
      expect(res1.status).toBe(400);

      const res2 = await verifyChatAccess(validId, "not-an-id");
      expect(res2.authorized).toBe(false);
      expect(res2.status).toBe(401);
    });

    it("rejects nonexistent match with 404", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      vi.spyOn(Match, "findById").mockResolvedValueOnce(null);

      const res = await verifyChatAccess(matchId, userId);
      expect(res.authorized).toBe(false);
      expect(res.status).toBe(404);
      expect(res.message).toBe("Conversation not found.");
    });

    it("rejects unmatched or inactive matches with 403", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [userId, new mongoose.Types.ObjectId()],
        status: "unmatched",
        unmatchedAt: new Date(),
      });

      const res = await verifyChatAccess(matchId, userId);
      expect(res.authorized).toBe(false);
      expect(res.status).toBe(403);
      expect(res.message).toContain("no longer active");
    });

    it("rejects nonparticipants with 403", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const intruderId = new mongoose.Types.ObjectId();
      const userA = new mongoose.Types.ObjectId();
      const userB = new mongoose.Types.ObjectId();

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [userA, userB],
        status: "active",
        unmatchedAt: null,
      });

      const res = await verifyChatAccess(matchId, intruderId);
      expect(res.authorized).toBe(false);
      expect(res.status).toBe(403);
      expect(res.message).toContain("not authorized");
    });

    it("rejects blocked pairs with 403 without revealing blocker", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const userA = new mongoose.Types.ObjectId();
      const userB = new mongoose.Types.ObjectId();

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [userA, userB],
        status: "active",
        unmatchedAt: null,
      });

      vi.spyOn(User, "findById").mockResolvedValueOnce({
        _id: userB,
        profileCompleted: true,
      });

      vi.spyOn(Block, "findOne").mockResolvedValueOnce({
        blocker: userB,
        blocked: userA,
      });

      const res = await verifyChatAccess(matchId, userA);
      expect(res.authorized).toBe(false);
      expect(res.status).toBe(403);
      expect(res.message).toContain("safety restrictions");
    });

    it("authorizes valid match participants", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const userA = new mongoose.Types.ObjectId();
      const userB = new mongoose.Types.ObjectId();

      const mockPartner = {
        _id: userB,
        name: "Clara",
        profileCompleted: true,
        toDiscoveryProfile: vi.fn().mockReturnValue({ id: userB.toString(), name: "Clara" }),
      };

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [userA, userB],
        status: "active",
        unmatchedAt: null,
      });

      vi.spyOn(User, "findById").mockResolvedValueOnce(mockPartner);
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);

      const res = await verifyChatAccess(matchId, userA);
      expect(res.authorized).toBe(true);
      expect(res.otherUserId).toBe(userB.toString());
      expect(res.partner).toBe(mockPartner);
    });
  });

  describe("Message Service (sendMessage, getHistory, markRead)", () => {
    it("successfully creates and returns a message with correct sender and recipient", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const senderId = new mongoose.Types.ObjectId();
      const recipientId = new mongoose.Types.ObjectId();

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [senderId, recipientId],
        status: "active",
        unmatchedAt: null,
      });
      vi.spyOn(User, "findById").mockResolvedValueOnce({
        _id: recipientId,
        profileCompleted: true,
      });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);

      const mockCreated = {
        _id: new mongoose.Types.ObjectId(),
        match: matchId,
        sender: senderId,
        recipient: recipientId,
        text: "Hey! Loved your profile.",
        clientMessageId: "client-key-1",
        readAt: null,
        createdAt: new Date(),
        toMessageDTO: function () {
          return {
            id: this._id.toString(),
            matchId: matchId.toString(),
            senderId: senderId.toString(),
            recipientId: recipientId.toString(),
            text: this.text,
            clientMessageId: this.clientMessageId,
            isRead: false,
            readAt: null,
            createdAt: this.createdAt.toISOString(),
          };
        },
      };

      vi.spyOn(Message, "findOne").mockResolvedValueOnce(null);
      vi.spyOn(Message, "create").mockResolvedValueOnce(mockCreated);

      const result = await sendMessage({
        matchId,
        senderId,
        text: "Hey! Loved your profile.",
        clientMessageId: "client-key-1",
      });

      expect(result.success).toBe(true);
      expect(result.message.text).toBe("Hey! Loved your profile.");
      expect(result.message.senderId).toBe(senderId.toString());
      expect(result.message.recipientId).toBe(recipientId.toString());
      expect(result.isDuplicate).toBe(false);
    });

    it("returns existing message on idempotent retry with duplicate clientMessageId", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const senderId = new mongoose.Types.ObjectId();
      const recipientId = new mongoose.Types.ObjectId();

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [senderId, recipientId],
        status: "active",
        unmatchedAt: null,
      });
      vi.spyOn(User, "findById").mockResolvedValueOnce({
        _id: recipientId,
        profileCompleted: true,
      });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);

      const existingMsg = {
        _id: new mongoose.Types.ObjectId(),
        match: matchId,
        sender: senderId,
        recipient: recipientId,
        text: "Sent message already",
        clientMessageId: "idempotent-key-42",
        readAt: null,
        createdAt: new Date(),
        toMessageDTO: function () {
          return {
            id: this._id.toString(),
            text: this.text,
            clientMessageId: this.clientMessageId,
          };
        },
      };

      vi.spyOn(Message, "findOne").mockResolvedValueOnce(existingMsg);
      const createSpy = vi.spyOn(Message, "create");

      const result = await sendMessage({
        matchId,
        senderId,
        text: "Sent message already",
        clientMessageId: "idempotent-key-42",
      });

      expect(result.success).toBe(true);
      expect(result.isDuplicate).toBe(true);
      expect(result.message.id).toBe(existingMsg._id.toString());
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("loads chronological conversation history with cursor pagination", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const userA = new mongoose.Types.ObjectId();
      const userB = new mongoose.Types.ObjectId();

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [userA, userB],
        status: "active",
        unmatchedAt: null,
      });
      vi.spyOn(User, "findById").mockResolvedValueOnce({
        _id: userB,
        profileCompleted: true,
        toDiscoveryProfile: vi.fn().mockReturnValue({ id: userB.toString(), name: "Elena" }),
      });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);

      const msg1 = {
        _id: new mongoose.Types.ObjectId(),
        match: matchId,
        sender: userA,
        recipient: userB,
        text: "First message",
        toMessageDTO: () => ({ id: "1", text: "First message" }),
      };
      const msg2 = {
        _id: new mongoose.Types.ObjectId(),
        match: matchId,
        sender: userB,
        recipient: userA,
        text: "Second message",
        toMessageDTO: () => ({ id: "2", text: "Second message" }),
      };

      // Query returns newest-first: [msg2, msg1]
      vi.spyOn(Message, "find").mockReturnValueOnce({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([msg2, msg1]),
      });

      const history = await getConversationHistory({
        matchId,
        userId: userA,
        limit: 10,
      });

      expect(history.success).toBe(true);
      // Reversed to chronological order for client
      expect(history.messages[0].text).toBe("First message");
      expect(history.messages[1].text).toBe("Second message");
      expect(history.partner.name).toBe("Elena");
    });

    it("marks only unread incoming messages addressed to current user as read", async () => {
      const matchId = new mongoose.Types.ObjectId();
      const userA = new mongoose.Types.ObjectId();
      const userB = new mongoose.Types.ObjectId();

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [userA, userB],
        status: "active",
        unmatchedAt: null,
      });
      vi.spyOn(User, "findById").mockResolvedValueOnce({
        _id: userB,
        profileCompleted: true,
      });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);

      const updateManySpy = vi.spyOn(Message, "updateMany").mockResolvedValueOnce({
        modifiedCount: 3,
      });

      const result = await markConversationRead({
        matchId,
        userId: userA,
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(3);
      expect(updateManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          match: matchId,
          recipient: userA,
          readAt: null,
        }),
        expect.objectContaining({
          $set: expect.objectContaining({ readAt: expect.any(Date) }),
        })
      );
    });

    it("returns correct unread count across active, non-blocked conversations", async () => {
      const userId = new mongoose.Types.ObjectId();
      const match1 = { _id: new mongoose.Types.ObjectId(), users: [userId, new mongoose.Types.ObjectId()] };

      vi.spyOn(Block, "find")
        .mockReturnValueOnce({ distinct: vi.fn().mockResolvedValue([]) })
        .mockReturnValueOnce({ distinct: vi.fn().mockResolvedValue([]) });

      vi.spyOn(Match, "find").mockReturnValueOnce({
        select: vi.fn().mockResolvedValueOnce([match1]),
      });

      vi.spyOn(Message, "countDocuments").mockResolvedValueOnce(5);
      vi.spyOn(Message, "aggregate").mockResolvedValueOnce([
        { _id: match1._id, count: 5 },
      ]);

      const counts = await getUnreadCounts({ userId });
      expect(counts.success).toBe(true);
      expect(counts.totalUnread).toBe(5);
      expect(counts.unreadByMatch[match1._id.toString()]).toBe(5);
    });
  });

  describe("Chat REST Controllers", () => {
    it("postMessage returns 201 with created message payload", async () => {
      const matchId = new mongoose.Types.ObjectId().toString();
      const req = {
        user: { _id: new mongoose.Types.ObjectId() },
        params: { matchId },
        body: { text: "Hello from REST", clientMessageId: "c-123" },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [req.user._id, new mongoose.Types.ObjectId()],
        status: "active",
        unmatchedAt: null,
      });
      vi.spyOn(User, "findById").mockResolvedValueOnce({ profileCompleted: true });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);
      vi.spyOn(Message, "findOne").mockResolvedValueOnce(null);
      vi.spyOn(Message, "create").mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        match: matchId,
        sender: req.user._id,
        recipient: new mongoose.Types.ObjectId(),
        text: "Hello from REST",
        clientMessageId: "c-123",
        toMessageDTO: () => ({ id: "m-1", text: "Hello from REST" }),
      });

      await postMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ text: "Hello from REST" }),
        })
      );
    });

    it("postMarkRead returns 200 with updated count", async () => {
      const matchId = new mongoose.Types.ObjectId().toString();
      const req = {
        user: { _id: new mongoose.Types.ObjectId() },
        params: { matchId },
        body: {},
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Match, "findById").mockResolvedValueOnce({
        _id: matchId,
        users: [req.user._id, new mongoose.Types.ObjectId()],
        status: "active",
        unmatchedAt: null,
      });
      vi.spyOn(User, "findById").mockResolvedValueOnce({ profileCompleted: true });
      vi.spyOn(Block, "findOne").mockResolvedValueOnce(null);
      vi.spyOn(Message, "updateMany").mockResolvedValueOnce({ modifiedCount: 2 });

      await postMarkRead(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ updatedCount: 2 }),
        })
      );
    });

    it("getUnread returns 200 with total unread counts", async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId() },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      vi.spyOn(Block, "find")
        .mockReturnValueOnce({ distinct: vi.fn().mockResolvedValue([]) })
        .mockReturnValueOnce({ distinct: vi.fn().mockResolvedValue([]) });
      vi.spyOn(Match, "find").mockReturnValueOnce({
        select: vi.fn().mockResolvedValueOnce([]),
      });

      await getUnread(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          totalUnread: 0,
        })
      );
    });
  });
});
