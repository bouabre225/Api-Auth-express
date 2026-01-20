import request  from "supertest"
import app from "../src/app"

describe("POST /auth/verify-email", () => {
    it("verify email with token", async () => {
        const res = await request(app)
            .post("/auth/verify-email")
            .send({ token });

        expect(res.status).toBe(200);
    })
})