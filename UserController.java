package com.lookme.lookmebackend.user;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:8081")
public class UserController {
    private final UserRepository userRepository;
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile(@RequestParam String username) {
        return userRepository.findByUsername(username).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(@RequestParam String query) {
        List<User> foundUsers = userRepository.findAll().stream()
                .filter(user -> user.getUsername().toLowerCase().contains(query.toLowerCase()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(foundUsers);
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<User>> getMyContacts(@RequestParam String username) {
        List<User> contacts = userRepository.findAll().stream()
                .filter(user -> !user.getUsername().equals(username))
                .collect(Collectors.toList());
        return ResponseEntity.ok(contacts);
    }
}