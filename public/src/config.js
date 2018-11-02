export default {
  apiGateway: {
    REGION: "us-east-1",
    URL: "https://kn7nugtrpe.execute-api.us-east-1.amazonaws.com/development"
  },
  cognito: {
    REGION: "us-east-1",
    USER_POOL_ID: "us-east-1_fEsRHuJxN",
    APP_CLIENT_ID: "5vpee8686d7h6j13nsjme2m6ho",
    IDENTITY_POOL_ID: "us-east-1:3dec6a82-62b5-4e23-a874-df8b3c79bce8"
  },
  s3: {
    UPLOADS_BUCKET: "sls-cognito-backend-development-uploads"
  }
};
