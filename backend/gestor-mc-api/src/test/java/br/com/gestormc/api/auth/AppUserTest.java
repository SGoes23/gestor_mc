package br.com.gestormc.api.auth;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import static org.assertj.core.api.Assertions.assertThat;

class AppUserTest {

    @Test
    void administrativeProfileProducesAdministrativeAuthority() {
        AppUser user = new AppUser(
                "admin@clube.com",
                "senha-codificada",
                AccessProfile.ADMINISTRATIVO
        );

        assertThat(user.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_ADMINISTRATIVO");
    }
}
