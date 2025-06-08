package com.lookme.lookmebackend.chat;
import jakarta.persistence.*;
import lombok.Data;

@Entity @Table(name = "chat_messages") @Data
public class ChatMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String senderUsername;
    private String recipientUsername;
    private String content;
    private String timestamp;
    public ChatMessage() {}
    public ChatMessage(String senderUsername, String recipientUsername, String content, String timestamp) {
        this.senderUsername = senderUsername;
        this.recipientUsername = recipientUsername;
        this.content = content;
        this.timestamp = timestamp;
    }
}