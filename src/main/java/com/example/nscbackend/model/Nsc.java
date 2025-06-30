package com.example.nscbackend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "quotations")
@Data
public class Nsc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String partyDetails;

    private String quotationNo;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate date;

    private String enquiryNo;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate enquiryDate;
    
    private String tax;
    private String delivery;
    private String payment;
    private String validity;
    private String freight;

    // Change is here: columnDefinition = "TEXT"
    @Column(columnDefinition = "TEXT")
    @Convert(converter = ProductListConverter.class)
    private List<Product> products;

    private LocalDateTime createdAt = LocalDateTime.now();
}