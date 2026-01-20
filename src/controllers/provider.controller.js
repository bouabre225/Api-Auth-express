import { validateData } from "#lib/validate";
import { googleSchema } from "#schemas/provider.schema";
import { googleFindOrCreateUser } from "#services/google.service";
import { AuthService } from "#services/auth.service";

export class ProviderController {
  static async googleAuth(req, res) {
    const { idToken } = validateData(googleSchema, req.body);

    const user = await googleFindOrCreateUser(idToken);

    // On réutilise la même logique que login pour créer access+refresh + loginHistory
    const tokens = await AuthService.issueTokens(
      user.id,
      req.ip,
      req.get("User-Agent") || ""
    );

    res.json(tokens);
  }
}