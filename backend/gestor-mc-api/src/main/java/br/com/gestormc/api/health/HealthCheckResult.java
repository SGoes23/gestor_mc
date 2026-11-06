package br.com.gestormc.api.health;

import java.util.Map;

public record HealthCheckResult(boolean healthy, Map<String, Object> details) {

    public HealthCheckResult {
        details = details == null ? Map.of() : Map.copyOf(details);
    }

    public static HealthCheckResult up(Map<String, Object> details) {
        return new HealthCheckResult(true, details);
    }

    public static HealthCheckResult down(Map<String, Object> details) {
        return new HealthCheckResult(false, details);
    }
}
