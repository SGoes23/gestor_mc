package br.com.gestormc.api.member;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MemberRepository extends JpaRepository<Member, Long> {
	List<Member> findByFullNameContainingIgnoreCaseOrNicknameContainingIgnoreCase(String fullName, String nickname);
}
