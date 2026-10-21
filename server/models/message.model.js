import mongoose from "mongoose";

/**
 * Message Mongoose Model
 * Represents a persistent one-to-one message exchanged between two valid match participants.
 */
const messageSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: [true, "Match reference is required"],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender reference is required"],
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient reference is required"],
      index: true,
    },
    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
      minlength: [1, "Message text cannot be empty"],
      maxlength: [2000, "Message cannot exceed 2,000 characters"],
    },
    clientMessageId: {
      type: String,
      trim: true,
      maxlength: [100, "clientMessageId cannot exceed 100 characters"],
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound Indexes ─────────────────────────────────────────────────────────

// Efficient pagination and history retrieval (newest first)
messageSchema.index({ match: 1, createdAt: -1, _id: -1 });

// Query unread messages for a specific conversation and recipient
messageSchema.index({ match: 1, recipient: 1, readAt: 1 });

// Fast unread count query across all conversations for a recipient
messageSchema.index({ recipient: 1, readAt: 1 });

// Idempotency constraint: scoped to match, sender, and clientMessageId
messageSchema.index(
  { match: 1, sender: 1, clientMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientMessageId: { $type: "string" } },
  }
);

// ── DTO Serializer ───────────────────────────────────────────────────────────
messageSchema.methods.toMessageDTO = function () {
  return {
    id: this._id.toString(),
    matchId: this.match.toString(),
    senderId: this.sender.toString(),
    recipientId: this.recipient.toString(),
    text: this.text,
    clientMessageId: this.clientMessageId || null,
    readAt: this.readAt ? this.readAt.toISOString() : null,
    isRead: Boolean(this.readAt),
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

export const Message = mongoose.model("Message", messageSchema);
