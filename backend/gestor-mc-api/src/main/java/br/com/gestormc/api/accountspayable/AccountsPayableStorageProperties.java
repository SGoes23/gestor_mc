package br.com.gestormc.api.accountspayable;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storage.accounts-payable")
public record AccountsPayableStorageProperties(
        String bucket,
        String endpoint,
        String region,
        String accessKey,
        String secretKey
) {
    public boolean isConfigured() {
        return hasText(bucket) && hasText(endpoint) && hasText(region) && hasText(accessKey) && hasText(secretKey);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
