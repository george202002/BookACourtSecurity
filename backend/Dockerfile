# Backend image for the Spring Boot API.

FROM maven:latest AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:latest
WORKDIR /app
RUN apt-get update && apt-get install -y curl
COPY --from=build /app/target/bookacourt-0.0.1-SNAPSHOT.jar app.jar
COPY secrets.env /app/secrets.env
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
