# NestJS Authentication API (GraphQL & Prisma)

## 🚀 Overview

This project is a RESTful API service built using **NestJS** with **TypeScript**, supporting **user authentication (standard & biometric)** and **registration**. The API uses **Prisma** as the ORM and **PostgreSQL** as the database, and is exposed through **GraphQL**.

## 📌 Features

- **User Registration** (email & password, hashed securely)
- **Register Biometric** (pass in the biometric key, jwt guarded)
- **Standard Login** (JWT-based authentication)
- **Biometric Login** (simulated biometric authentication)
- **Fetching Authenticated User (`me` query)**
- **Prisma ORM Integration with PostgreSQL**
- **GraphQL API with NestJS**
- **Secure Handling of Passwords & Biometric Keys**

---

## 🛠 Environment Setup

### 1️⃣ Clone the Repository

```sh
git clone <(https://github.com/Abdulhaleem-6/test-project.git)>
cd <test-project>
```

### 2️⃣ Install Dependencies

```sh
yarn install
```

### 3️⃣ Set Up Environment Variables

Create a `.env` file in the root directory and add the following:

```env
DB_USER ="user"
DB_PASSWORD="password"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="dbname"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRATION='2days'
```

### 4️⃣ Set Up Docker (PostgreSQL)

If you are using **Docker**, create a `docker-compose.yml` file:

```yaml
services:
  db:
    image: postgres:latest
    restart: always
    ports:
      - '5432:5432'
    container_name: test-project-db-1
    env_file: ./.env
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - ./db:/var/lib/postgresql/data
```

Start the database with:

```sh
docker-compose up -d
```

### 5️⃣ Run Prisma Migrations

```sh
yarn prisma migrate dev
```

### 6️⃣ Start the NestJS Server

```sh
yarn start:dev
```

Your GraphQL Playground should now be available at:

```
http://localhost:3000/graphql
```

---

## 🔥 API Documentation

### 📌 **GraphQL Schema Overview**

#### **User Model (Prisma)**

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  password     String
  biometricKey String?  @unique
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### **1️⃣ User Registration**

#### **Mutation**

```graphql
mutation RegisterUser {
  register(input: { email: "test@example.com", password: "securepassword" }) {
    id
    email
    createdAt
  }
}
```

### **2️⃣ Standard Login**

#### **Mutation**

```graphql
mutation Login {
  login(input: { email: "test@example.com", password: "securepassword" }) {
    userId
    email
    accessToken
  }
}
```

### **3️⃣ Biometric Login**

#### **Mutation**

```graphql
mutation BiometricLogin {
  biometricLogin(input: { biometricKey: "sample_biometric_key_123" }) {
    userId
    email
    accessToken
  }
}
```

### **4️⃣ Fetch Authenticated User**

#### **Query**

```graphql
query Me {
  user {
    id
    email
    createdAt
    biometricKey
  }
}
```

#### **Headers (Authorization Required)**

```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

---

## ✅ Running Tests

Run unit tests using Jest:

```sh
yarn test
```

---

## 📂 Postman Collection

To simplify testing, you can import the **Postman Collection** included in the project.

1. Open **Postman**
2. Click on **Import**
3. Select the provided `postman_collection.json`
4. Create a user on the Register User endpoint
5. Login with the details of the user on the Login Endpoint, a script is attached to it so it automatically sets your jwt to the accessToken from the request response.

---

## 📌 Additional Notes

- Ensure your database is running before running migrations.
- Use strong passwords and store the **JWT secret** securely.
- You can modify Prisma models and run `yarn prisma migrate dev --name update` to apply changes.

---

## 📞 Need Help?

For any issues, feel free to open a GitHub issue or reach out via email.

Happy coding! 🚀
