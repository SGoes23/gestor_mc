package br.com.gestormc.api.motorcycle;

import br.com.gestormc.api.member.Member;
import br.com.gestormc.api.member.MemberRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
public class MotorcycleController {

    private final MotorcycleRepository motorcycleRepository;
    private final MemberRepository memberRepository;

    public MotorcycleController(MotorcycleRepository motorcycleRepository, MemberRepository memberRepository) {
        this.motorcycleRepository = motorcycleRepository;
        this.memberRepository = memberRepository;
    }

    @GetMapping("/api/members/{memberId}/motorcycles")
    public List<MotorcycleResponse> listByMember(@PathVariable Long memberId) {
        ensureMemberExists(memberId);
        return motorcycleRepository.findByMemberId(memberId).stream().map(this::toResponse).toList();
    }

    @PostMapping("/api/members/{memberId}/motorcycles")
    @ResponseStatus(HttpStatus.CREATED)
    public MotorcycleResponse create(@PathVariable Long memberId, @RequestBody @Valid UpsertMotorcycleRequest request) {
        Member member = getMemberOrThrow(memberId);
        Motorcycle motorcycle = new Motorcycle(
                request.model(),
                request.year(),
                request.color(),
                request.licensePlate(),
                member
        );
        return toResponse(motorcycleRepository.save(motorcycle));
    }

    @PutMapping("/api/motorcycles/{motorcycleId}")
    public MotorcycleResponse update(@PathVariable Long motorcycleId, @RequestBody @Valid UpsertMotorcycleRequest request) {
        Motorcycle motorcycle = motorcycleRepository.findById(motorcycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Moto nao encontrada"));

        Member member = getMemberOrThrow(request.memberId());
        motorcycle.setModel(request.model());
        motorcycle.setYear(request.year());
        motorcycle.setColor(request.color());
        motorcycle.setLicensePlate(request.licensePlate());
        motorcycle.setMember(member);

        return toResponse(motorcycleRepository.save(motorcycle));
    }

    @DeleteMapping("/api/motorcycles/{motorcycleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long motorcycleId) {
        Motorcycle motorcycle = motorcycleRepository.findById(motorcycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Moto nao encontrada"));
        motorcycleRepository.delete(motorcycle);
    }

    private void ensureMemberExists(Long memberId) {
        if (!memberRepository.existsById(memberId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro nao encontrado");
        }
    }

    private Member getMemberOrThrow(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro nao encontrado"));
    }

    private MotorcycleResponse toResponse(Motorcycle motorcycle) {
        return new MotorcycleResponse(
                motorcycle.getId(),
                motorcycle.getModel(),
                motorcycle.getYear(),
                motorcycle.getColor(),
                motorcycle.getLicensePlate(),
                motorcycle.getMember().getId()
        );
    }

    public record UpsertMotorcycleRequest(
            @NotBlank String model,
            @NotNull Integer year,
            @NotBlank String color,
            @NotBlank String licensePlate,
            @NotNull Long memberId
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
