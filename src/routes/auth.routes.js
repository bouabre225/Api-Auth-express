import { Router } from "express"
import {asyncHandler} from "#lib/async-handler"
import {AuthController} from "#controllers/auth.controller"
import { ProviderController } from "#controllers/provider.controller"
import { authMiddleware } from "#middlewares/auth.middleware"


const router = Router()

router.post('/auth/register', asyncHandler(AuthController.register))
router.post('/auth/google', asyncHandler(ProviderController.googleAuth))
router.post("/auth/login", asyncHandler(AuthController.login))
router.post("/auth/refresh", asyncHandler(AuthController.refresh))
router.post('/auth/verify-email', asyncHandler(AuthController.verifyEmailController))
router.post("/auth/logout", asyncHandler(AuthController.logout))
router.post("/auth/logout-all", authMiddleware, asyncHandler(AuthController.logoutAll))
router.post("/auth/forgot-password", asyncHandler(AuthController.forgotPassword));
router.post("/auth/reset-password", asyncHandler(AuthController.resetPassword));

export default router