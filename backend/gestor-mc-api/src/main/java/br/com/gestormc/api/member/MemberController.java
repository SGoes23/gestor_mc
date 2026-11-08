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
                normalizePhone(request.phone(), "Telefone"),
                request.bloodType(),
                normalizePhone(request.emergencyContact(), "Contato de emergencia"),
                request.address(),
                normalizePostalCode(request.postalCode()),
                normalizeCpf(request.cpf()),
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
        member.setPhone(normalizePhone(request.phone(), "Telefone"));
        member.setBloodType(request.bloodType());
        member.setEmergencyContact(normalizePhone(request.emergencyContact(), "Contato de emergencia"));
        member.setAddress(request.address());
        if (request.postalCode() != null) {
            member.setPostalCode(normalizePostalCode(request.postalCode()));
        }
        if (request.cpf() != null) {
            member.setCpf(normalizeCpf(request.cpf()));
        }
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

    private String digitsOnly(String value) {
        return value.replaceAll("\\D", "");
    }

    private String normalizePhone(String value, String fieldName) {
        String digits = digitsOnly(value);
        if (digits.length() < 10 || digits.length() > 11) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " deve conter 10 ou 11 digitos");
        }
        return digits;
    }

    private String normalizePostalCode(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String digits = digitsOnly(value);
        if (digits.length() != 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CEP deve conter 8 digitos");
        }
        return digits;
    }

    private String normalizeCpf(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String digits = digitsOnly(value);
        if (!isValidCpf(digits)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF invalido");
        }
        return digits;
    }

    private boolean isValidCpf(String cpf) {
        if (cpf.length() != 11 || cpf.chars().distinct().count() == 1) {
            return false;
        }
        for (int digitIndex = 9; digitIndex < 11; digitIndex++) {
            int sum = 0;
            for (int index = 0; index < digitIndex; index++) {
                sum += Character.getNumericValue(cpf.charAt(index)) * (digitIndex + 1 - index);
            }
            int checkDigit = (sum * 10) % 11;
            if (checkDigit == 10) checkDigit = 0;
            if (checkDigit != Character.getNumericValue(cpf.charAt(digitIndex))) return false;
        }
        return true;
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
                member.getPostalCode(),
                member.getCpf(),
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
                summary.postalCode(),
                summary.cpf(),
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
            String postalCode,
            String cpf,
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
            String postalCode,
            String cpf,
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
            String postalCode,
            String cpf,
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
