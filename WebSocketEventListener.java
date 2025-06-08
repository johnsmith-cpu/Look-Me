package com.lookme.lookmebackend.chat;
import com.lookme.lookmebackend.user.User;
import com.lookme.lookmebackend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import java.util.Optional;

@Component
public class WebSocketEventListener {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);
    private final SimpMessageSendingOperations messagingTemplate;
    private final UserRepository userRepository;

    public WebSocketEventListener(SimpMessageSendingOperations messagingTemplate, UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : null;
        if (username != null) {
            logger.info("User connected: {}", username);
            Optional<User> userOptional = userRepository.findByUsername(username);
            userOptional.ifPresent(user -> {
                user.setStatus("Online");
                userRepository.save(user);
                messagingTemplate.convertAndSend("/topic/public", new ChatMessage("System", null, username + " is now Online", ""));
            });
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : null;
        if (username != null) {
            logger.info("User disconnected: {}", username);
            Optional<User> userOptional = userRepository.findByUsername(username);
            userOptional.ifPresent(user -> {
                user.setStatus("Offline");
                userRepository.save(user);
                messagingTemplate.convertAndSend("/topic/public", new ChatMessage("System", null, username + " is now Offline", ""));
            });
        }
    }
}