<?php

test('the home route redirects to the library', function () {
    $this->get(route('home'))->assertRedirect(route('documents.index'));
});
