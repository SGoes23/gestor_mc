package br.com.gestormc.api.accountspayable;

public interface DocumentStorage {
    void upload(String key, byte[] content, String contentType);
    StoredDocument download(String key);
    void deleteQuietly(String key);

    record StoredDocument(byte[] content, String contentType) {
    }
}
