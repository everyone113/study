from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from app.services.code_runner import execute_code, SNIPPETS

router = APIRouter(prefix="/api/code", tags=["Code Playground"])

class CodeRunRequest(BaseModel):
    language: str = Field(..., examples=["java", "cpp", "python"])
    code: str
    stdin: Optional[str] = ""
    timeout_sec: Optional[int] = 8

@router.post("/run")
async def run_code(req: CodeRunRequest):
    result = await execute_code(
        language=req.language,
        code=req.code,
        stdin=req.stdin or "",
        timeout_sec=req.timeout_sec or 8
    )
    return result

@router.get("/snippets")
async def get_snippets():
    return SNIPPETS
