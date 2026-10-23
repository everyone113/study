from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, model_validator

class MindmapNode(BaseModel):
    id: str
    text: str
    color: Optional[str] = None
    isCollapsed: Optional[bool] = False
    collapsed: Optional[bool] = False
    notes: Optional[str] = ""
    icon: Optional[str] = None
    side: Optional[str] = None
    children: List['MindmapNode'] = Field(default_factory=list)

    @model_validator(mode='after')
    def sync_collapse_flags(self):
        # Keep isCollapsed and collapsed in sync for frontend compatibility
        if self.collapsed and not self.isCollapsed:
            self.isCollapsed = True
        elif self.isCollapsed and not self.collapsed:
            self.collapsed = True
        return self

MindmapNode.model_rebuild()

class MindmapCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = ""
    root_node: Optional[Union[MindmapNode, Dict[str, Any]]] = None
    root_data: Optional[Union[MindmapNode, Dict[str, Any]]] = None
    tags: Optional[str] = "General"
    user_id: Optional[str] = "guest"

    @model_validator(mode='after')
    def sync_root_node(self):
        if self.root_node is None and self.root_data is not None:
            self.root_node = self.root_data
        elif self.root_data is None and self.root_node is not None:
            self.root_data = self.root_node
        return self

class MindmapUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    root_node: Optional[Union[MindmapNode, Dict[str, Any]]] = None
    root_data: Optional[Union[MindmapNode, Dict[str, Any]]] = None
    tags: Optional[str] = None

    @model_validator(mode='after')
    def sync_root_node(self):
        if self.root_node is None and self.root_data is not None:
            self.root_node = self.root_data
        elif self.root_data is None and self.root_node is not None:
            self.root_data = self.root_node
        return self

class MindmapResponse(BaseModel):
    id: str
    user_id: Optional[str] = "guest"
    title: str
    description: Optional[str] = ""
    root_node: Union[MindmapNode, Dict[str, Any]]
    root_data: Optional[Union[MindmapNode, Dict[str, Any]]] = None
    tags: Optional[str] = "General"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    node_count: Optional[int] = 0

    @model_validator(mode='after')
    def sync_root_data(self):
        if self.root_data is None and self.root_node is not None:
            self.root_data = self.root_node
        return self

class MindmapSummary(BaseModel):
    id: str
    user_id: Optional[str] = "guest"
    title: str
    description: Optional[str] = ""
    tags: Optional[str] = "General"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    node_count: Optional[int] = 0

class MindmapGenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Markdown outline, bullet points, or plain text")
    title: Optional[str] = None
    user_id: Optional[str] = "guest"
    save: Optional[bool] = False
    mode: Optional[str] = "auto"

class FlashcardExportItem(BaseModel):
    front: str
    back: str

class MindmapExportFlashcardsRequest(BaseModel):
    deck_name: Optional[str] = "Mindmap Flashcards"
    cards: Optional[List[FlashcardExportItem]] = None
