import { Request, Response, NextFunction } from "express";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  console.error("Error caught by middleware:", err);

  res.status(err.status || 500).json({
    message: err.message || "Something went wrong. Please try again later.",
  });

};

export { errorHandler };