from urllib import parse

from django import template


register = template.Library()


@register.simple_tag(takes_context=True)
def remove_query_params(context, *args):
    return parse.urlencode(
        {key: value for key, value in context['request'].GET.items() if key not in args}
    )


@register.simple_tag()
def get_form_field(form, field_name):
    return form.fields.get(field_name)
