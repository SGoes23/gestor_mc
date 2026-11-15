package br.com.gestormc.api.accountspayable;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

@Configuration
@EnableConfigurationProperties(AccountsPayableStorageProperties.class)
public class AccountsPayableStorageConfig {

    @Bean
    S3Client accountsPayableS3Client(AccountsPayableStorageProperties properties) {
        var builder = S3Client.builder()
                .endpointOverride(URI.create(properties.endpoint()))
                .region(Region.of(properties.region()))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());

        if (properties.isConfigured()) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(properties.accessKey(), properties.secretKey())
            ));
        }
        return builder.build();
    }
}
