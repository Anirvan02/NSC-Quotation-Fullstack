package com.example.nscbackend.model;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Product {

    // Getters and Setters
    private String desc;
    private String unit;
    private String gst;
    private String rate;
    private String brand;

    // Constructors
    public Product() {
    }

    public Product(String desc, String unit, String gst, String rate, String brand) {
        this.desc = desc;
        this.unit = unit;
        this.gst = gst;
        this.rate = rate;
        this.brand = brand;
    }

}
