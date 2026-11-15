package br.com.gestormc.api.accountspayable;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Service
public class S3DocumentStorage implements DocumentStorage {

    private final S3Client s3Client;
    private final AccountsPayableStorageProperties properties;

    public S3DocumentStorage(S3Client s3Client, AccountsPayableStorageProperties properties) {
        this.s3Client = s3Client;
        this.properties = properties;
    }

    @Override
    public void upload(String key, byte[] content, String contentType) {
        ensureConfigured();
        try {
            s3Client.putObject(PutObjectRequest.builder()
                    .bucket(properties.bucket())
                    .key(key)
                    .contentType(contentType)
                    .contentLength((long) content.length)
                    .build(), RequestBody.fromBytes(content));
        } catch (S3Exception exception) {
            throw storageFailure("Nao foi possivel enviar o documento ao bucket", exception);
        }
    }

    @Override
    public StoredDocument download(String key) {
        ensureConfigured();
        try {
            var response = s3Client.getObjectAsBytes(GetObjectRequest.builder()
                    .bucket(properties.bucket())
                    .key(key)
                    .build());
            return new StoredDocument(response.asByteArray(), response.response().contentType());
        } catch (S3Exception exception) {
            throw storageFailure("Nao foi possivel baixar o documento do bucket", exception);
        }
    }

    @Override
    public void deleteQuietly(String key) {
        if (!properties.isConfigured()) return;
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(properties.bucket()).key(key).build());
        } catch (RuntimeException ignored) {
            // Compensacao de melhor esforco quando a persistencia da conta falha.
        }
    }

    private void ensureConfigured() {
        if (!properties.isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "O armazenamento de contas a pagar ainda nao foi configurado");
        }
    }

    private ResponseStatusException storageFailure(String message, S3Exception exception) {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, message, exception);
    }
}
