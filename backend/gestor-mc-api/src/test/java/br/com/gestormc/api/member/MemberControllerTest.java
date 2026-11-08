package br.com.gestormc.api.member;

import br.com.gestormc.api.auth.AccessProfile;
import br.com.gestormc.api.auth.AppUser;
import br.com.gestormc.api.auth.AppUserRepository;
import br.com.gestormc.api.motorcycle.MotorcycleRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MemberControllerTest {

    @Test
    void createsLinkedAdministrativeLoginWithEncodedPassword() {
        MemberRepository memberRepository = mock(MemberRepository.class);
        MotorcycleRepository motorcycleRepository = mock(MotorcycleRepository.class);
        AppUserRepository userRepository = mock(AppUserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        MemberController controller = new MemberController(
                memberRepository,
                motorcycleRepository,
                userRepository,
                passwordEncoder
        );
        when(userRepository.findByEmail("admin@clube.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("senha123")).thenReturn("senha-codificada");
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MemberController.MemberSummaryResponse response = controller.create(request());

        ArgumentCaptor<AppUser> user = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(user.capture());
        assertThat(user.getValue().getEmail()).isEqualTo("admin@clube.com");
        assertThat(user.getValue().getPassword()).isEqualTo("senha-codificada");
        assertThat(user.getValue().getProfile()).isEqualTo(AccessProfile.ADMINISTRATIVO);
        assertThat(user.getValue().getMember()).isNotNull();
        assertThat(response.email()).isEqualTo("admin@clube.com");
        assertThat(response.profile()).isEqualTo(AccessProfile.ADMINISTRATIVO);
    }

    @Test
    void updatesProfileOfExistingLinkedLogin() {
        MemberRepository memberRepository = mock(MemberRepository.class);
        MotorcycleRepository motorcycleRepository = mock(MotorcycleRepository.class);
        AppUserRepository userRepository = mock(AppUserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        MemberController controller = new MemberController(
                memberRepository,
                motorcycleRepository,
                userRepository,
                passwordEncoder
        );
        Member member = new Member(
                "Maria Silva",
                "Maria",
                "11999999999",
                BloodType.O_POSITIVE,
                "José - 11888888888",
                "Rua Central, 10",
                "Tesoureira",
                MemberStatus.ATIVO
        );
        AppUser user = new AppUser("admin@clube.com", "senha-atual", AccessProfile.MEMBRO, member);
        when(memberRepository.findById(10L)).thenReturn(Optional.of(member));
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findByMemberId(10L)).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("admin@clube.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("senha123")).thenReturn("senha-codificada");
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MemberController.MemberSummaryResponse response = controller.update(10L, request());

        assertThat(user.getProfile()).isEqualTo(AccessProfile.ADMINISTRATIVO);
        assertThat(response.profile()).isEqualTo(AccessProfile.ADMINISTRATIVO);
        assertThat(user.getPassword()).isEqualTo("senha-codificada");
        verify(userRepository).save(user);
    }

    private MemberController.UpsertMemberRequest request() {
        return new MemberController.UpsertMemberRequest(
                "Maria Silva",
                "Maria",
                "11999999999",
                BloodType.O_POSITIVE,
                "José - 11888888888",
                "Rua Central, 10",
                "Tesoureira",
                MemberStatus.ATIVO,
                "admin@clube.com",
                "senha123",
                AccessProfile.ADMINISTRATIVO
        );
    }
}
