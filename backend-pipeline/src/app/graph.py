from langgraph.constants import END
from langgraph.graph import StateGraph
from src.app.nodes.intent_node import intent_node
from src.app.nodes.blueprint_node import blueprint_node
from src.app.nodes.section_planner_node import section_planner_node
from src.app.nodes.section_generator_node import section_builder_node
from src.app.nodes.page_generator import page_generator_node
from src.app.state import State

def build_graph() :

    graph = StateGraph(State)

    # Define the nodes
    graph.add_node("intent_node", intent_node)
    graph.add_node("blueprint_node", blueprint_node)
    graph.add_node("section_planner_node", section_planner_node)
    graph.add_node("section_builder_node", section_builder_node)
    graph.add_node("page_generator_node", page_generator_node)

    # Define the edges
    graph.set_entry_point("intent_node")
    graph.add_edge("intent_node", "blueprint_node")

    graph.add_edge("blueprint_node", "section_planner_node")
    graph.add_edge("blueprint_node", "page_generator_node")

    graph.add_edge("section_planner_node", "section_builder_node")

    graph.add_conditional_edges(
    "section_builder_node",
    lambda s: "END" if s.get("status") == "Done" else "section_builder_node",
    {"END": END, "section_builder_node": "section_builder_node"}
)
    
    graph.add_conditional_edges(
    "page_generator_node",
    lambda s: "END" if s.get("page_status") == "Done" else "page_generator_node",
    {"END": END, "page_generator_node": "page_generator_node"}
)
    

    agent = graph.compile()
    
    print("Graph Compiled Successfully ✅")

    return agent