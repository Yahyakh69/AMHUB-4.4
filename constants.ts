
export const API_URL = "https://es-flight-api-us.djigate.com";

// Headers
export const PROJECT_UUID = "4149cc35-4491-4249-a050-d0a7f336fa45";
export const USER_TOKEN = "eyJhbGciOiJIUzUxMiIsImNyaXQiOlsidHlwIiwiYWxnIiwia2lkIl0sImtpZCI6IjBkNzQyMzFmLTgxOWYtNDE3NS04NWUzLTRhZDQxODUzMzEyZiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50IjoiYmlsYWwuYkBhbXQudHYiLCJleHAiOjIwODMzMzU1NjIsIm5iZiI6MTc2NzgwMjc2Miwib3JnYW5pemF0aW9uX3V1aWQiOiIxNjNhMTliOC1jYmZlLTRjMjItOTJjMi01NGIyODYxYmRiOTkiLCJwcm9qZWN0X3V1aWQiOiIiLCJzdWIiOiJmaDIiLCJ1c2VyX2lkIjoiMjAwMDg1NTIwNDAyMTkyNzkzNiJ9.bD1Rfk79HHkfbLf5CyHM5KujY4uPV4D1idBePHF_CiZ4ofRZYTYEd7I2QVHVpldVdxSD1rbkjBheMO7eFK6SKA";

// Body Defaults
export const WORKFLOW_UUID = "7e165090-47f1-4124-8f57-69f5fe8c218e";
export const CREATOR_ID = "1612734689961263104";

export const WORKFLOW_OPTIONS = [
  { 
    name: 'Default DFR', 
    uuid: '7e165090-47f1-4124-8f57-69f5fe8c218e',
    center: { lat: 25.195699, lng: 55.275049 } 
  }
];

// Default to Dubai (Burj Khalifa area)
export const DEFAULT_LAT = 25.197525;
export const DEFAULT_LNG = 55.274288;
export const DEFAULT_LEVEL = 5;
export const DEFAULT_DESC = "Something has happened, please verify immediately";
export const USE_CORS_PROXY = true;
