import request  from "supertest"
import app from "../src/app"

describe("POST /auth/register", () => {
    it("register new user", async () => {
        const res = await request(app)
        .post("/auth/register")
        .send({
            email: "test@mail.com",
            password: "Password123",
            firstName: "John",
            lastName: "Doe"
        })

        expect(res.status).toBe(201)
        expect(res.body.user.email).toBe("test@mail.com")
        expect(res.body).toHaveProperty("message")
    })
})