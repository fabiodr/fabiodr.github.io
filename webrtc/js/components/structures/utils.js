/*
Copyright 2017 Vector Creations Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


export function getId(isLocal, id) {
    return (isLocal ? 'local-' : 'remote-') + id;
}

export function createVideoElement(isLocal, id) {
    const elId = getId(isLocal, id);
    let el = document.getElementById(elId);
    if (!el) {
        el = document.createElement('video');
    }
    el.id = elId;
    el.autoplay = true;
    if (isLocal) {
        el.muted = true;
    }
    return el;
}

export function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&]*)|&|$)');
    const results = regex.exec(url);
    if (!results) {
        return null;
    }
    if (!results[2]) {
        return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
