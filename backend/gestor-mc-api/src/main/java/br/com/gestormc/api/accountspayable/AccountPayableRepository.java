package br.com.gestormc.api.accountspayable;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountPayableRepository extends JpaRepository<AccountPayable, Long> {
    List<AccountPayable> findAllByOrderByDueDateDescIdDesc();
}
