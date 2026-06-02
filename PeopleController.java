package com.careertrack.controller;

import com.careertrack.model.Student;
import com.careertrack.model.Teacher;
import com.careertrack.model.User;
import com.careertrack.repository.StudentRepository;
import com.careertrack.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/people")
@CrossOrigin(origins = "*")
public class PeopleController {

    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private TeacherRepository teacherRepository;

    private static final String UPLOAD_DIR = "uploads/diplomas/";

    @GetMapping("/search")
    public ResponseEntity<?> searchPeople(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String degree,
            @RequestParam(required = false) String filiere,
            @RequestParam(required = false) Boolean featured
    ) {
        try {
            List<Map<String, Object>> results = new ArrayList<>();

            List<Student> students = studentRepository.findAll();
            List<Teacher> teachers = teacherRepository.findAll();

            if (type == null || "STUDENT".equalsIgnoreCase(type)) {
                for (Student s : students) {
                    User user = s.getUser();
                    if (featured != null && featured) {
                        if (user == null || !Boolean.TRUE.equals(user.getFeatured())
                            || user.getFeaturedExpiresAt() == null
                            || user.getFeaturedExpiresAt().isBefore(LocalDateTime.now())) {
                            continue;
                        }
                    }
                    if (degree != null && !degree.isEmpty() && !Objects.equals(s.getDegree(), degree)) {
                        continue;
                    }
                    if (keyword != null && !keyword.isBlank()) {
                        String full = (s.getFirstName() + " " + s.getLastName()).toLowerCase();
                        if (!full.contains(keyword.toLowerCase())) continue;
                    }
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", s.getId());
                    m.put("type", "STUDENT");
                    m.put("userId", user != null ? user.getId() : s.getId());
                    m.put("firstName", s.getFirstName());
                    m.put("lastName", s.getLastName());
                    m.put("email", s.getEmail());
                    m.put("profilePhoto", s.getProfilePhoto());
                    m.put("university", s.getUniversity());
                    m.put("graduationYear", s.getGraduationYear());
                    m.put("degree", s.getDegree());
                    m.put("diplomaImage", s.getDiplomaImage());
                    results.add(m);
                }
            }

            if (type == null || "TEACHER".equalsIgnoreCase(type)) {
                for (Teacher t : teachers) {
                    User user = t.getUser();
                    if (featured != null && featured) {
                        if (user == null || !Boolean.TRUE.equals(user.getFeatured())
                            || user.getFeaturedExpiresAt() == null
                            || user.getFeaturedExpiresAt().isBefore(LocalDateTime.now())) {
                            continue;
                        }
                    }
                    if (filiere != null && !filiere.isEmpty() && !Objects.equals(t.getFiliere(), filiere)) {
                        continue;
                    }
                    if (keyword != null && !keyword.isBlank()) {
                        String full = (t.getFirstName() + " " + t.getLastName()).toLowerCase();
                        if (!full.contains(keyword.toLowerCase())) continue;
                    }
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", t.getId());
                    m.put("type", "TEACHER");
                    m.put("userId", user != null ? user.getId() : t.getId());
                    m.put("firstName", t.getFirstName());
                    m.put("lastName", t.getLastName());
                    m.put("email", t.getEmail());
                    m.put("profilePhoto", t.getProfilePhoto());
                    m.put("department", t.getDepartment());
                    m.put("subject", t.getSubject());
                    m.put("experience", t.getExperience());
                    m.put("filiere", t.getFiliere());
                    results.add(m);
                }
            }

            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/students/{id}")
    public ResponseEntity<?> getStudent(@PathVariable Long id) {
        try {
            Optional<Student> opt = studentRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(opt.get());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            Optional<Student> opt = studentRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            Student s = opt.get();
            if (data.containsKey("degree")) s.setDegree((String) data.get("degree"));
            if (data.containsKey("diplomaImage")) s.setDiplomaImage((String) data.get("diplomaImage"));
            studentRepository.save(s);
            return ResponseEntity.ok(Map.of("success", true, "student", s));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/teachers/{id}")
    public ResponseEntity<?> getTeacher(@PathVariable Long id) {
        try {
            Optional<Teacher> opt = teacherRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(opt.get());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/teachers/{id}")
    public ResponseEntity<?> updateTeacher(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            Optional<Teacher> opt = teacherRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            Teacher t = opt.get();
            if (data.containsKey("filiere")) t.setFiliere((String) data.get("filiere"));
            teacherRepository.save(t);
            return ResponseEntity.ok(Map.of("success", true, "teacher", t));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/upload/diploma")
    public ResponseEntity<?> uploadDiploma(@RequestParam("file") MultipartFile file) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
            String filename = "diploma_" + System.currentTimeMillis() + extension;
            Path filePath = uploadPath.resolve(filename);

            Files.write(filePath, file.getBytes());

            String fileUrl = "/uploads/diplomas/" + filename;
            return ResponseEntity.ok(Map.of("success", true, "url", fileUrl));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }
}
