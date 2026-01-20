import { AuthService } from "#services/auth.service"
import { AuthDto } from "#dto/auth.dto"
import { signAccessToken } from "#lib/jwt"
import { validateData } from "#lib/validate"
import { registerSchema, loginSchema , refreshSchema, logoutSchema} from "#schemas/auth.schema"
import { success } from "zod"

export class AuthController {
    static async register (req, res) {
        const validatedData = validateData(registerSchema, req.body)
        await AuthService.register(validatedData)

        res.status(201).json({
            success: true, 
            message: "Verification email sent"
        })
    }

    static async  verifyEmailController(req, res) {
      const {token} = req.query;

      await AuthService.verifyEmail(token);
      res.json({
        success: true,
        message: "Email verified successfully",
      });
    }

  static async forgotPassword(req, res) {

    const { email } = req.body

    await AuthService.forgotPassword(email)
    res.json({ 
      success: true,
      message: "If the email exists, a reset link has been sent"
    })
  }

  static async resetPassword(req, res) {

    const { token, password } = req.body

    await AuthService.resetPassword(token, password)
    res.json({ 
      success: true,
      message: "Password reset successful",
    })
  }

  static async login(req, res) {
  const data = validateData(loginSchema, req.body);
  const tokens = await AuthService.login(
    data,
    req.ip,
    req.get("User-Agent") || ""
  );
  res.json(tokens);
}

  static async refresh(req, res) {

    const { refreshToken } = validateData(refreshSchema, req.body)
    const tokens = await AuthService.refresh(
      refreshToken
    )

    res.status(200).json(tokens);
  }

  static async logout(req, res) {

    const { refreshToken } = validateData(logoutSchema, req.body)
    await AuthService.logout(refreshToken);
    res.status(204).send();
  }

  static async logoutAll(req, res) {
    await AuthService.logoutAll(req.user.id);
    res.status(204).send();
  }

}