<?php

namespace App\Enums;

enum AnnotationType: string
{
    case Highlight = 'highlight';
    case Note = 'note';
    case Drawing = 'drawing';
}
