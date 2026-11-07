package br.com.gestormc.api.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.Map;

@Component
@Order(1)
public class DatabaseHealthCheck implements ApplicationHealthCheck {

    private static final Logger LOGGER = LoggerFactory.getLogger(DatabaseHealthCheck.class);
    private static final int VALIDATION_TIMEOUT_SECONDS = 2;

    private final DataSource dataSource;

    public DatabaseHealthCheck(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public String name() {
        return "database";
    }

    @Override
    public HealthCheckResult check() {
        try (Connection connection = dataSource.getConnection()) {
            if (!connection.isValid(VALIDATION_TIMEOUT_SECONDS)) {
                return HealthCheckResult.down(Map.of("message", "Database connection is not valid"));
            }

            DatabaseMetaData metadata = connection.getMetaData();
            return HealthCheckResult.up(Map.of(
                    "product", metadata.getDatabaseProductName(),
                    "version", metadata.getDatabaseProductVersion()
            ));
        } catch (SQLException exception) {
            LOGGER.warn("Database healthcheck failed", exception);
            return HealthCheckResult.down(Map.of("message", "Database connection failed"));
        }
    }
}
