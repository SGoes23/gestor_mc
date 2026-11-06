package br.com.gestormc.api;

import br.com.gestormc.api.health.ApplicationHealthCheck;
import br.com.gestormc.api.health.HealthCheckResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private static final Logger LOGGER = LoggerFactory.getLogger(HealthController.class);

    private final List<ApplicationHealthCheck> healthChecks;

    public HealthController(List<ApplicationHealthCheck> healthChecks) {
        this.healthChecks = healthChecks;
    }

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> health() {
        Map<String, ComponentHealth> components = new LinkedHashMap<>();
        boolean allComponentsAreHealthy = true;

        for (ApplicationHealthCheck healthCheck : healthChecks) {
            long startTime = System.nanoTime();
            HealthCheckResult result = execute(healthCheck);
            long responseTimeMs = (System.nanoTime() - startTime) / 1_000_000;

            components.put(
                    healthCheck.name(),
                    new ComponentHealth(
                            result.healthy() ? "UP" : "DOWN",
                            responseTimeMs,
                            result.details()
                    )
            );

            if (!result.healthy()) {
                allComponentsAreHealthy = false;
            }
        }

        String status = allComponentsAreHealthy ? "UP" : "DOWN";
        HealthResponse response = new HealthResponse(
                "gestor-mc-api",
                status,
                OffsetDateTime.now().toString(),
                components
        );

        HttpStatus httpStatus = allComponentsAreHealthy
                ? HttpStatus.OK
                : HttpStatus.SERVICE_UNAVAILABLE;

        return ResponseEntity.status(httpStatus).body(response);
    }

    private HealthCheckResult execute(ApplicationHealthCheck healthCheck) {
        try {
            return healthCheck.check();
        } catch (RuntimeException exception) {
            LOGGER.error(
                    "Unexpected error while checking component {}",
                    healthCheck.name(),
                    exception
            );
            return HealthCheckResult.down(Map.of("message", "Healthcheck execution failed"));
        }
    }

    public record HealthResponse(
            String service,
            String status,
            String timestamp,
            Map<String, ComponentHealth> components
    ) {
    }

    public record ComponentHealth(
            String status,
            long responseTimeMs,
            Map<String, Object> details
    ) {
    }
}
