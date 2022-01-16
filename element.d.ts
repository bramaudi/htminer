interface Element {
  find(query: string): Element|null
  findAll(query: string): NodeListOf<Element>
}