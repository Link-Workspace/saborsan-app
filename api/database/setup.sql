-- Executar esse script no Azure SQL para criar as tabelas necessárias

CREATE TABLE Sessions (
  id INT IDENTITY(1,1) PRIMARY KEY,
  deviceId NVARCHAR(36) NOT NULL CONSTRAINT UQ_Sessions_DeviceId UNIQUE,
  userId NVARCHAR(255) NULL,
  createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE Messages (
  id INT IDENTITY(1,1) PRIMARY KEY,
  deviceId NVARCHAR(36) NOT NULL,
  userId NVARCHAR(255) NULL,
  role NVARCHAR(20) NOT NULL,       -- 'user' ou 'assistant'
  content NVARCHAR(MAX) NOT NULL,
  createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX IX_Messages_DeviceId ON Messages(deviceId);
CREATE INDEX IX_Messages_UserId ON Messages(userId);
