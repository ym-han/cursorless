from typing import Any

from talon import Module

mod = Module()


@mod.capture(rule="(previous | next) [<number_small>] <user.cursorless_scope_type>")
def cursorless_relative_scope(m) -> dict[str, Any]:
    """Previous/next scope"""
    return {
        "type": "relativeScope",
        "scopeType": m.cursorless_scope_type,
        "offset": 1,
        "length": getattr(m, "number_small", 1),
        "direction": "backward" if m[0] == "previous" else "forward",
    }


@mod.capture(rule="<number_small> <user.cursorless_scope_type> [backward]")
def cursorless_scope_count(m) -> dict[str, Any]:
    """Previous/next scope"""
    return {
        "type": "relativeScope",
        "scopeType": m.cursorless_scope_type,
        "offset": 0,
        "length": m.number_small,
        "direction": "backward" if m[-1] == "backward" else "forward",
    }
