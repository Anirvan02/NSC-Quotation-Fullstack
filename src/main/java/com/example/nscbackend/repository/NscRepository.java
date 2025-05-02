package com.example.nscbackend.repository;

import com.example.nscbackend.model.Nsc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface NscRepository extends JpaRepository<Nsc, Long> {

    List<Nsc> findAllByOrderByCreatedAtDesc();

    @Modifying
    @Transactional
    @Query(value = "ALTER SEQUENCE quotations_id_seq RESTART WITH 1;", nativeQuery = true)
    void resetAutoIncrement();
}
