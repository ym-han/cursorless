from typing import Any

from talon import Module

from ..compound_targets import is_active_included, is_anchor_included

mod = Module()


mod.list("cursorless_subtoken_scope_type", desc="Supported subtoken scope types")


@mod.capture(rule="<user.ordinals_small> | last")
def ordinal_or_last(m) -> int:
    """An ordinal or the word 'last'"""
    if m[0] == "last":
        return -1
    return m.ordinals_small - 1


@mod.capture(
    rule="<user.ordinal_or_last> [{user.cursorless_range_connective} <user.ordinal_or_last>] <user.cursorless_scope_type>"
)
def cursorless_ordinal_range(m) -> dict[str, Any]:
    """Ordinal range"""
    try:
        range_connective = m.cursorless_range_connective
        include_anchor = is_anchor_included(range_connective)
        include_active = is_active_included(range_connective)
        anchor = create_absolute_scope_modifier(
            m.cursorless_scope_type, m.ordinal_or_last_list[0]
        )
        active = create_absolute_scope_modifier(
            m.cursorless_scope_type, m.ordinal_or_last_list[1]
        )
        return {
            "type": "range",
            "anchor": anchor,
            "active": active,
            "excludeAnchor": not include_anchor,
            "excludeActive": not include_active,
        }
    except AttributeError:
        return create_absolute_scope_modifier(
            m.cursorless_scope_type, m.ordinal_or_last_list[0]
        )


@mod.capture(rule="(first | last) <number_small> <user.cursorless_scope_type>")
def cursorless_first_last_range(m) -> dict[str, Any]:
    """First/last range"""
    if m[0] == "first":
        return create_absolute_scope_modifier(
            m.cursorless_scope_type, 0, m.number_small
        )
    return create_absolute_scope_modifier(
        m.cursorless_scope_type, -m.number_small, m.number_small
    )


@mod.capture(rule="(previous | next) <user.cursorless_scope_type>")
def cursorless_previous_next_scope(m) -> dict[str, Any]:
    """Previous/next scope"""
    return {
        "type": "relativeOrdinalScope",
        "scopeType": m.cursorless_scope_type,
        "offset": 1,
        "length": 1,
        "direction": "backward" if m[0] == "previous" else "forward",
    }


@mod.capture(
    rule=(
        "<user.cursorless_ordinal_range> | "
        "<user.cursorless_first_last_range> | "
        "<user.cursorless_previous_next_scope>"
    )
)
def cursorless_ordinal_scope(m) -> dict[str, Any]:
    """Ordinal ranges such as subwords or characters"""
    return m[0]


def create_absolute_scope_modifier(scope_type: Any, start: int, length: int = 1):
    return {
        "type": "absoluteOrdinalScope",
        "scopeType": scope_type,
        "start": start,
        "length": length,
    }