package com.lookme.lookmebackend.auth;
import com.lookme.lookmebackend.user.User;
import com.lookme.lookmebackend.user.UserRepository;
import com.lookme.lookmebackend.util.PasswordUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:8081")
public class AuthController {
    private final UserRepository userRepository;
    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody User newUser) {
        if (userRepository.findByUsername(newUser.getUsername()).isPresent()) {
            return new ResponseEntity<>("Username is already taken!", HttpStatus.BAD_REQUEST);
        }
        newUser.setPasswordHash(PasswordUtil.hashPassword(newUser.getPasswordHash()));
        newUser.setStatus("Offline");
        userRepository.save(newUser);
        return new ResponseEntity<>("User registered successfully!", HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<String> loginUser(@RequestBody LoginRequest req) {
        return userRepository.findByUsername(req.getUsername())
                .map(user -> PasswordUtil.checkPassword(req.getPassword(), user.getPasswordHash()) ?
                        new ResponseEntity<>("Login successful! Welcome " + user.getUsername(), HttpStatus.OK) :
                        new ResponseEntity<>("Invalid credentials!", HttpStatus.UNAUTHORIZED))
                .orElse(new ResponseEntity<>("Invalid credentials!", HttpStatus.UNAUTHORIZED));
    }
}