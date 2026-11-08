package br.com.gestormc.api.health;

/**
 * Contract for infrastructure checks exposed by the application health endpoint.
 * New dependencies such as RabbitMQ or Redis can provide another Spring component
 * implementing this interface and will be included automatically.
 */
public interface ApplicationHealthCheck {

    String name();

    HealthCheckResult check();
}
