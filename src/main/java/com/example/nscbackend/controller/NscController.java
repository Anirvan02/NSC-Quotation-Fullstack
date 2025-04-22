package com.example.nscbackend.controller;

import com.example.nscbackend.model.Nsc;
import com.example.nscbackend.repository.NscRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/quotations")
@CrossOrigin
public class NscController {

    @Autowired
    private NscRepository repository;

    // Create
    @PostMapping
    public Map<String, Object> createQuotation(@RequestBody Nsc quotation) {
        Nsc saved = repository.save(quotation);
        return Map.of("message", "Quotation saved", "id", saved.getId());
    }

    // Get all
    @GetMapping
    public List<Nsc> getAllQuotations() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    // Get one
    @GetMapping("/{id}")
    public Nsc getQuotation(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("Quotation not found"));
    }

    // Update
    @PutMapping("/{id}")
    public Map<String, String> updateQuotation(@PathVariable Long id, @RequestBody Nsc quotation) {
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("Quotation not found");
        }
        quotation.setId(id);
        repository.save(quotation);
        return Map.of("message", "Quotation updated");
    }

    // Delete all
    @DeleteMapping
    public Map<String, String> deleteAllQuotations() {
        repository.deleteAll();
        repository.resetAutoIncrement(); // optional: handled in custom implementation
        return Map.of("message", "All quotations deleted and ID reset to 1");
    }
}