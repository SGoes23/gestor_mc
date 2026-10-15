package br.com.gestormc.api.member;

import br.com.gestormc.api.motorcycle.Motorcycle;
import br.com.gestormc.api.motorcycle.MotorcycleRepository;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberRepository memberRepository;
    private final MotorcycleRepository motorcycleRepository;

    public MemberController(MemberRepository memberRepository, MotorcycleRepository motorcycleRepository) {
        this.memberRepository = memberRepository;
        this.motorcycleRepository = motorcycleRepository;
    }

    @GetMapping
    public List<MemberSummaryResponse> listAll(@RequestParam(required = false) String query) {
        List<Member> members;
        if (query == null || query.isBlank()) {
            members = memberRepository.findAll();
        } else {
            members = memberRepository.findByFullNameContainingIgnoreCaseOrNicknameContainingIgnoreCase(query, query);
        }
        return members.stream().map(this::toSummary).toList();
    }

    @GetMapping("/{id}")
    public MemberDetailResponse detail(@PathVariable Long id) {
        Member member = findMemberById(id);
        List<MotorcycleResponse> motorcycles = motorcycleRepository.findByMemberId(id)
                .stream()
                .map(this::toMotorcycleResponse)
                .toList();
        return toDetail(member, motorcycles);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MemberSummaryResponse create(@RequestBody @Valid UpsertMemberRequest request) {
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
        return toSummary(memberRepository.save(member));
    }

    @PutMapping("/{id}")
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
        return toSummary(memberRepository.save(member));
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

    private MemberSummaryResponse toSummary(Member member) {
        return new MemberSummaryResponse(
                member.getId(),
                member.getFullName(),
                member.getNickname(),
                member.getPhone(),
                member.getBloodType(),
                member.getEmergencyContact(),
                member.getAddress(),
                member.getRole(),
                member.getStatus()
        );
    }

    private MemberDetailResponse toDetail(Member member, List<MotorcycleResponse> motorcycles) {
        MemberSummaryResponse summary = toSummary(member);
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
            MemberStatus status
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
            MemberStatus status
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
