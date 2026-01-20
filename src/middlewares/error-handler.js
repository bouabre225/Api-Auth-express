import { HttpException } from "#lib/exceptions";
import { logger } from "#lib/logger";

export function errorHandler(err, req, res, next) {

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON",
    })
  }

  const isProduction = process.env.NODE_ENV === "production"


  if (err instanceof HttpException) {
    logger.warn({ err, path:req.path}, err.message)
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details && { details: err.details }),
    })
  }

  logger.error({ err, path:req.path}, 'Unhandled error occurred')

  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      error: "Resource already exists",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      error: "Resource not found",
    });
  }

  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON",
    });
  }


  res.status(500).json({
    success: false,
    error: isProduction ? "Internal Server Error" : err.message,
    ...(!isProduction && { stack: err.stack }),
  });
}

