package com.example.nscbackend.model;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.List;

@Converter
public class ProductListConverter implements AttributeConverter<List<Product>, String> {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<Product> attribute) {
        try {
            return mapper.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new RuntimeException("Could not convert product list to JSON", e);
        }
    }

    @Override
    public List<Product> convertToEntityAttribute(String dbData) {
        try {
            return mapper.readValue(dbData, new TypeReference<List<Product>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Could not convert JSON to product list", e);
        }
    }
}
