package com.lookme.lookmebackend.user;
import jakarta.persistence.*;
import lombok.Data;

@Entity @Table(name = "users") @Data
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String username;
    @Column(nullable = false)
    private String passwordHash;
    private String status;
    public User() {}
    public User(String username, String passwordHash, String status) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.status = status;
    }
}