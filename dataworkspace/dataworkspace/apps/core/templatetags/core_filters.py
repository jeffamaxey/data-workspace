import bleach
from markdown import Markdown
from django import template

from django.forms import ChoiceField, Field
from markupsafe import Markup

register = template.Library()


@register.filter
def is_choice_field(field: Field):
    return isinstance(field, ChoiceField)


@register.filter
def get_choice_field_data_for_gtm(field: ChoiceField):
    """
    Takes a Django form ChoiceField and returns a string where selected options are concatenated
    and separated by semi-colons - as wanted by performance analysts.

    This is intended to be used to pass filters into Google Tag Manager's Data Layer as JSON for
    analytics.
    """

    # NB: The str() *is* required here as the labels are overridden for scrolling_filter into
    # a SearchableChoice object
    return ";".join(sorted(str(x.data["label"]) for x in field if x.data["selected"]))


@register.filter
def minimal_markdown(text):
    md = Markdown()
    return Markup(
        bleach.clean(
            md.convert(text or ""),
            tags=["p", "ul", "ol", "li", "strong", "br"],
            attributes={},
            strip=True,
        )
    )


@register.filter("startswith")
def startswith(text, starts):
    if isinstance(text, str):
        return text.startswith(starts)

    return False
