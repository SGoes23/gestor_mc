package br.com.gestormc.api.member;

import br.com.gestormc.api.auth.AccessProfile;
import br.com.gestormc.api.auth.AppUser;
import br.com.gestormc.api.auth.AppUserRepository;
import br.com.gestormc.api.motorcycle.Motorcycle;
import br.com.gestormc.api.motorcycle.MotorcycleRepository;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberRepository memberRepository;
    private final MotorcycleRepository motorcycleRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public MemberController(MemberRepository memberRepository, MotorcycleRepository motorcycleRepository,
                            AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.memberRepository = memberRepository;
        this.motorcycleRepository = motorcycleRepository;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<MemberSummaryResponse> listAll(@RequestParam(required = false) String query) {
        List<Member> members;
        if (query == null || query.isBlank()) {
            members = memberRepository.findAll();
        } else {
            members = memberRepository.findByFullNameContainingIgnoreCaseOrNicknameContainingIgnoreCase(query, query);
        }
        return members.stream().map(member -> toSummary(member, findUser(member.getId()))).toList();
    }

    @GetMapping("/{id}")
    public MemberDetailResponse detail(@PathVariable Long id) {
        Member member = findMemberById(id);
        List<MotorcycleResponse> motorcycles = motorcycleRepository.findByMemberId(id)
                .stream()
                .map(this::toMotorcycleResponse)
                .toList();
        return toDetail(member, findUser(member.getId()), motorcycles);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MemberSummaryResponse create(@RequestBody @Valid UpsertMemberRequest request) {
        if (request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha inicial e obrigatoria");
        }
        ensureEmailAvailable(request.email(), null);
        Member member = new Member(
                request.fullName(),
                request.nickname(),
                request.phone(),
                request.bloodType(),
                request.emergencyContact(),
                request.address(),
                request.role(),
                request.status() == null ? MemberStatus.ATIVO : request.status()
        );
        member = memberRepository.save(member);
        AppUser user = appUserRepository.save(new AppUser(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.profile(),
                member
        ));
        return toSummary(member, user);
    }

    @PutMapping("/{id}")
    @Transactional
    public MemberSummaryResponse update(@PathVariable Long id, @RequestBody @Valid UpsertMemberRequest request) {
        Member member = findMemberById(id);
        member.setFullName(request.fullName());
        member.setNickname(request.nickname());
        member.setPhone(request.phone());
        member.setBloodType(request.bloodType());
        member.setEmergencyContact(request.emergencyContact());
        member.setAddress(request.address());
        member.setRole(request.role());
        member.setStatus(request.status() == null ? MemberStatus.ATIVO : request.status());
        member = memberRepository.save(member);
        AppUser user = findUser(id);
        ensureEmailAvailable(request.email(), user == null ? null : user.getId());
        if (user == null) {
            if (request.password() == null || request.password().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha inicial e obrigatoria para criar o acesso");
            }
            user = new AppUser(request.email(), passwordEncoder.encode(request.password()), request.profile(), member);
        } else {
            user.setEmail(request.email());
            user.setProfile(request.profile());
            if (request.password() != null && !request.password().isBlank()) {
                user.setPasswordHash(passwordEncoder.encode(request.password()));
            }
        }
        return toSummary(member, appUserRepository.save(user));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        Member member = findMemberById(id);
        memberRepository.delete(member);
    }

    private Member findMemberById(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro nao encontrado"));
    }

    private AppUser findUser(Long memberId) {
        return appUserRepository.findByMemberId(memberId).orElse(null);
    }

    private void ensureEmailAvailable(String email, Long currentUserId) {
        appUserRepository.findByEmail(email).ifPresent(existing -> {
            if (!existing.getId().equals(currentUserId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail ja utilizado por outro usuario");
            }
        });
    }

    private MemberSummaryResponse toSummary(Member member, AppUser user) {
        return new MemberSummaryResponse(
                member.getId(),
                member.getFullName(),
                member.getNickname(),
                member.getPhone(),
                member.getBloodType(),
                member.getEmergencyContact(),
                member.getAddress(),
                member.getRole(),
                member.getStatus(),
                user == null ? null : user.getEmail(),
                user == null ? AccessProfile.MEMBRO : user.getProfile()
        );
    }

    private MemberDetailResponse toDetail(Member member, AppUser user, List<MotorcycleResponse> motorcycles) {
        MemberSummaryResponse summary = toSummary(member, user);
        return new MemberDetailResponse(
                summary.id(),
                summary.fullName(),
                summary.nickname(),
                summary.phone(),
                summary.bloodType(),
                summary.emergencyContact(),
                summary.address(),
                summary.role(),
                summary.status(),
                summary.email(),
                summary.profile(),
                motorcycles
        );
    }

    private MotorcycleResponse toMotorcycleResponse(Motorcycle motorcycle) {
        return new MotorcycleResponse(
                motorcycle.getId(),
                motorcycle.getModel(),
                motorcycle.getYear(),
                motorcycle.getColor(),
                motorcycle.getLicensePlate(),
                motorcycle.getMember().getId()
        );
    }

    public record UpsertMemberRequest(
            @NotBlank String fullName,
            @NotBlank String nickname,
            @NotBlank String phone,
            @NotNull BloodType bloodType,
            @NotBlank String emergencyContact,
            @NotBlank String address,
            @NotBlank String role,
            MemberStatus status,
            @Email @NotBlank String email,
            String password,
            @NotNull AccessProfile profile
    ) {
    }

    public record MemberSummaryResponse(
            Long id,
            String fullName,
            String nickname,
            String phone,
            BloodType bloodType,
            String emergencyContact,
            String address,
            String role,
            MemberStatus status,
            String email,
            AccessProfile profile
    ) {
    }

    public record MemberDetailResponse(
            Long id,
            String fullName,
            String nickname,
            String phone,
            BloodType bloodType,
            String emergencyContact,
            String address,
            String role,
            MemberStatus status,
            String email,
            AccessProfile profile,
            List<MotorcycleResponse> motorcycles
    ) {
    }

    public record MotorcycleResponse(
            Long id,
            String model,
            Integer year,
            String color,
            String licensePlate,
            Long memberId
    ) {
    }
}
