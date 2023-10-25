/*Matitaviola   WEB APP I  A.A. 2022/23 */
'use strict';

const dayjs = require('dayjs');

function Page(id, title, author, creationDate, publicationDate) {
  this.id = id;
  this.title = title;
  this.author = author;
  this.creationDate = dayjs(creationDate);
  this.publicationDate = publicationDate? dayjs(publicationDate) : null //the page is shown to non-logged users only if pubdate is >= today
  /*
  “scheduled” (the publication date is in the future), 
  “published” (the publication date is today or in the past).
  “draft” (empty publication date), 
  */
    if(publicationDate){
        this.status = this.publicationDate.isAfter(dayjs())? "scheduled" : "published"
    }
    else
        this.status = "draft";
}

function Content(id, pageId, type, value, position) {
  this.id = id;
  this.pageId = pageId;
  this.type = type;
  this.value = value;
  this.position = position;
}

module.exports = {Page, Content}